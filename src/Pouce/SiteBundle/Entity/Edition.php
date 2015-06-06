<?php

namespace Pouce\SiteBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Edition
 *
 * @ORM\Table()
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
     * @ORM\ManyToMany(targetEntity="Pouce\UserBundle\Entity\School", mappedBy="schools")
     */
    private $schools;

    /**
     * @var integer
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="year", type="integer")
     */
    private $year;

    /**
     * @var integer
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="month", type="integer")
     */
    private $month;

    /**
     * @var integer
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="day", type="integer")
     */
    private $day;


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
     * Set year
     *
     * @param integer $year
     * @return Edition
     */
    public function setYear($year)
    {
        $this->year = $year;

        return $this;
    }

    /**
     * Get year
     *
     * @return integer 
     */
    public function getYear()
    {
        return $this->year;
    }

    /**
     * Set month
     *
     * @param integer $month
     * @return Edition
     */
    public function setMonth($month)
    {
        $this->month = $month;

        return $this;
    }

    /**
     * Get month
     *
     * @return integer 
     */
    public function getMonth()
    {
        return $this->month;
    }

    /**
     * Set day
     *
     * @param integer $day
     * @return Edition
     */
    public function setDay($day)
    {
        $this->day = $day;

        return $this;
    }

    /**
     * Get day
     *
     * @return integer 
     */
    public function getDay()
    {
        return $this->day;
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
}
