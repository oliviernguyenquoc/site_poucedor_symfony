<?php

namespace Pouce\SiteBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Edition
 *
 * @ORM\Table(name="edition")
 * @ORM\Entity(repositoryClass="Pouce\SiteBundle\Entity\EditionRepository")
 */
class Edition
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToMany(targetEntity="Pouce\UserBundle\Entity\School", mappedBy="editions")
     */
    private $schools;

    /**
     * @var date
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="dateOfEvent", type="date")
     */
    private $dateOfEvent;

    /**
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     * @Assert\Choice({"registering", "finished", "scheduled", "inProgress"})
     *
     * @ORM\Column(name="status", type="string", length=35)
     */
    private $status;

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }


    /**
     * Constructor
     */
    public function __construct()
    {
        $this->schools = new \Doctrine\Common\Collections\ArrayCollection();
    }


    /**
     * Add schools
     *
     * @param \Pouce\UserBundle\Entity\School $schools
     * @return Edition
     */
    public function addSchool(\Pouce\UserBundle\Entity\School $schools)
    {
        $this->schools[] = $schools;
        $schools->setEdition($this); //Ajout de la génération pour ne pas boucler à l'infinie (SdZ p.215)
        return $this;
    }
    /**
     * Remove schools
     *
     * @param \Pouce\UserBundle\Entity\School $schools
     */
    public function removeSchool(\Pouce\UserBundle\Entity\School $schools)
    {
        $this->schools->removeElement($schools);
        $school->setEdition(null);
    }
    
    /**
     * Get schools
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getSchools()
    {
        return $this->schools;
    }

    /**
     * Set status
     *
     * @param string $status
     * @return Edition
     */
    public function setStatus($status)
    {
        $this->status = $status;

        return $this;
    }

    /**
     * Get status
     *
     * @return string 
     */
    public function getStatus()
    {
        return $this->status;
    }

    /**
     * Set dateOfEvent
     *
     * @param \DateTime $dateOfEvent
     * @return Edition
     */
    public function setDateOfEvent($dateOfEvent)
    {
        $this->dateOfEvent = $dateOfEvent;

        return $this;
    }

    /**
     * Get dateOfEvent
     *
     * @return \DateTime 
     */
    public function getDateOfEvent()
    {
        return $this->dateOfEvent;
    }

}
